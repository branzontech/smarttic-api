import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Like, DataSource } from 'typeorm';
import { Form } from './entities/form.entity';
import { TicketTitle } from '../ticket-title/entities/ticket-title.entity';
import { FormField } from '../form-fields/entities/form-field.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormField)
    private readonly fieldRepository: Repository<FormField>,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== CRUD CON TRANSACCIONES ====================

  async create(createFormDto: CreateFormDto): Promise<Form> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar nombre único
      await this.validateUniqueName(createFormDto.name, queryRunner);

      // 2. Crear formulario base (sin campos todavía)
      const form = await queryRunner.manager.save(Form, {
        name: createFormDto.name,
        description: createFormDto.description,
        isTemplate: createFormDto.isTemplate,
        isActive: createFormDto.isActive ?? true,
        version: createFormDto.version ?? 1,
      });

      // 3. Crear campos asociados (si existen)
      if (createFormDto.fields?.length) {
        await this.createFormFields(form.id, createFormDto.fields, queryRunner);
      }

      
      if (createFormDto.titles?.length) {
        await this.assignToTitles(
          form.id,
          createFormDto.titles,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

      // 5. Retornar el formulario completo con relaciones
      return this.getFormWithDetails(form.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleError(error, 'Error al crear formulario');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filter?: string,
    isTemplate?: boolean,
  ): Promise<{ data: Form[]; total: number }> {
    try {
      const query = this.formRepository
        .createQueryBuilder('form')
        .leftJoinAndSelect('form.fields', 'fields')
        .where('form.deletedAt IS NULL')
        .orderBy('form.createdAt', 'DESC')
        .skip(skip)
        .take(take);

      // Filtro por texto (nombre o descripción)
      if (filter) {
        query.andWhere(
          '(form.name ILIKE :filter OR form.description ILIKE :filter)',
          {
            filter: `%${filter}%`,
          },
        );
      }

      // Filtro por tipo (template o no)
      if (isTemplate !== undefined) {
        query.andWhere('form.isTemplate = :isTemplate', { isTemplate });
      }

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error) {
      this.handleError(error, 'Error al listar formularios');
    }
  }

  async findById(id: string): Promise<Form> {
    try {
      const form = await this.getFormWithDetails(id);
      if (!form) {
        throw new NotFoundException(`Formulario con ID ${id} no encontrado`);
      }
      return form;
    } catch (error) {
      this.handleError(error, 'Error al obtener formulario');
    }
  }

  async findByTitleId(titleId: string): Promise<Form> {
    try {
      const form  = await this.formRepository.findOne({
      where: { titles: { id: titleId } },
      relations: ['fields', 'titles'],
      order: { fields: { order: 'ASC' } },
    });

    
      return form;
    } catch (error) {
      this.handleError(error, 'Error al obtener formulario');
    }
  }

  async update(id: string, updateFormDto: UpdateFormDto): Promise<Form> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const form = await queryRunner.manager.findOne(Form, {
        where: { id },
        relations: ['fields', 'titles'],
      });

      if (!form) {
        throw new NotFoundException(`Formulario con ID ${id} no encontrado`);
      }

      if (updateFormDto.name && updateFormDto.name !== form.name) {
        await this.validateUniqueName(updateFormDto.name, queryRunner);
      }

      Object.assign(form, {
        name: updateFormDto.name ?? form.name,
        description: updateFormDto.description ?? form.description,
        isActive: updateFormDto.isActive ?? form.isActive,
      });
      

      if (updateFormDto.fields) {
        await queryRunner.manager.delete(FormField, { form: { id } });

        const newFields = updateFormDto.fields.map((field) => ({
          ...field,
          form: { id },
        }));
        await queryRunner.manager.save(FormField, newFields);
        
        form.fields = newFields as any;
      }

      
      if (updateFormDto.titles) {
        const updatedTitles = await queryRunner.manager.find(TicketTitle, {
          where: { id: In(updateFormDto.titles) },
          relations: ['form'],
        });

        const conflicted = updatedTitles.filter(
          (t) => t.form && t.form.id !== id,
        );

        if (conflicted.length > 0) {
          throw new ConflictException(
            `Títulos ya asignados: ${conflicted.map(t => t.id).join(', ')}`
          );
        }

        for (const t of updatedTitles) {
          t.form = { id } as any;
        }

        form.titles = updatedTitles; 
      }

      await queryRunner.manager.save(Form, form);
      await queryRunner.commitTransaction();

      return this.getFormWithDetails(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleError(error, 'Error al actualizar formulario');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const form = await queryRunner.manager.findOne(Form, {
        where: { id },
        relations: ['titles'],
      });

      if (!form) {
        throw new NotFoundException(`Formulario con ID ${id} no encontrado`);
      }

      // Romper relación con TicketTitles (poner formId en null)
      if (form.titles?.length > 0) {
        for (const title of form.titles) {
          await queryRunner.manager.update(
            TicketTitle,
            { id: title.id },
            { form: null }
          );
        }
      }

      // Eliminar campos relacionados (por cascada también puede aplicar si usas cascade)
      // await queryRunner.manager.delete(FormField, { form: { id } });

      // Eliminado suave del formulario
      await queryRunner.manager.softDelete(Form, { id });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleError(error, 'Error al eliminar formulario');
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== MÉTODOS PARA TEMPLATES ====================

  async getTemplateFields(templateId: string): Promise<FormField[]> {
    try {
      const template = await this.formRepository.findOne({
        where: { id: templateId, isTemplate: true },
        relations: ['fields'],
      });

      if (!template) {
        throw new NotFoundException('Template no encontrado o no es válido');
      }

      return template.fields;
    } catch (error) {
      this.handleError(error, 'Error al obtener campos del template');
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async createFormFields(
    formId: string,
    fields: any[],
    queryRunner: any,
  ): Promise<void> {
    const fieldEntities = fields.map((field) =>
      this.fieldRepository.create({
        ...field,
        form: { id: formId },
      }),
    );

    await queryRunner.manager.save(FormField, fieldEntities);
  }

  private async assignToTitles(
    formId: string,
    titleIds: string[],
    queryRunner: any,
  ): Promise<void> {
    // Validar que las títulos existan
    const titles = await queryRunner.manager.find(TicketTitle, {
      where: { id: In(titleIds) },
      relations: ['form'],
    });

    if (titles.length !== titleIds.length) {
      const missingIds = titleIds.filter(
        (id) => !titles.some((c) => c.id === id),
      );
      throw new NotFoundException(
        `titulos no ecnontrados: ${missingIds.join(', ')}`,
      );
    }

    // Verificar que ninguna título ya tenga formulario asignado
    const conflictedTitles = titles.filter(
      (c) => c.form && c.form.id !== formId,
    );
    if (conflictedTitles.length > 0) {
      throw new ConflictException(
        `Los siguientes títulos ya tienen un formulario asignado: ${conflictedTitles.map((c) => c.name).join(', ')}`,
      );
    }

    // Actualizar asignaciones
    await queryRunner.manager.update(
      TicketTitle,
      { id: In(titleIds) },
      { form: { id: formId } },
    );
  }


  private async validateUniqueName(
    name: string,
    queryRunner: any,
  ): Promise<void> {
    const existing = await queryRunner.manager.findOne(Form, {
      where: { name, deletedAt: IsNull() },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un formulario con el nombre: ${name}`,
      );
    }
  }

  private async getFormWithDetails(id: string): Promise<Form> {
    const form = await this.formRepository.findOne({
      where: { id },
      relations: ['fields', 'titles', 'titles.ticketCategory'],
      order: { fields: { order: 'ASC' } },
    });

    if (!form) {
      throw new NotFoundException(`Formulario con ID ${id} no encontrado`);
    }

    return {
      ...form,
      ticketCategoryId:form.titles[0]?.ticketCategory.id,
      titles: form.titles?.map((cat) => cat.id) ?? [],
    } as any;
  }

  private handleError(error: any, context: string): never {
    console.error(`${context}:`, error.message);
    if (
      error instanceof ConflictException ||
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }
    throw new InternalServerErrorException(context);
  }
}
