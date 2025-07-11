import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormResponse } from './entities/form-response.entity';
import { CreateFormResponseDto } from './dto/create-form-response.dto';
import { UpdateFormResponseDto } from './dto/update-form-response.dto';

@Injectable()
export class FormResponsesService {
  constructor(
    @InjectRepository(FormResponse)
    private readonly formResponseRepository: Repository<FormResponse>,
  ) {}

  async create(dto: CreateFormResponseDto): Promise<FormResponse> {
    try {
      const exists = await this.formResponseRepository.findOne({
        where: { formId: dto.formId, ticketId: dto.ticketId },
      });

      if (exists) {
        throw new ConflictException(
          'Ya existe una respuesta para este formulario y ticket.',
        );
      }

      const response = this.formResponseRepository.create(dto);
      return await this.formResponseRepository.save(response);
    } catch (error) {
      this.handleError(error, 'Error al crear la respuesta del formulario');
    }
  }

  async findAll(
    skip = 0,
    take = 10,
    filter?: string,
  ): Promise<{ data: FormResponse[]; total: number }> {
    try {
      const query = this.formResponseRepository
        .createQueryBuilder('formResponse')
        .leftJoinAndSelect('formResponse.form', 'form')
        .leftJoinAndSelect('formResponse.ticket', 'ticket')
        .orderBy('formResponse.createdAt', 'DESC')
        .skip(skip)
        .take(take);

      // Filtro de texto: busca en notes y nombre del formulario
      if (filter) {
        query.andWhere(
          `(formResponse.notes ILIKE :filter OR form.name ILIKE :filter)`,
          { filter: `%${filter}%` },
        );
      }

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error) {
      this.handleError(error, 'Error al listar respuestas de formulario');
    }
  }

  async findById(id: string): Promise<FormResponse> {
    try {
      const response = await this.formResponseRepository.findOne({
        where: { id },
        relations: ['form', 'ticket'],
      });

      if (!response) {
        throw new NotFoundException(`Respuesta con ID ${id} no encontrada`);
      }

      return response;
    } catch (error) {
      this.handleError(error, 'Error al obtener respuesta');
    }
  }

  async update(id: string, dto: UpdateFormResponseDto): Promise<FormResponse> {
    try {
      const existing = await this.findById(id);
      Object.assign(existing, dto);
      return await this.formResponseRepository.save(existing);
    } catch (error) {
      this.handleError(error, 'Error al actualizar la respuesta');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const existing = await this.findById(id);
      await this.formResponseRepository.remove(existing);
    } catch (error) {
      this.handleError(error, 'Error al eliminar respuesta');
    }
  }

  private handleError(error: any, context: string): never {
    console.error(`${context}:`, error.message);
    if (
      error instanceof ConflictException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }
    throw new InternalServerErrorException(context);
  }
}
