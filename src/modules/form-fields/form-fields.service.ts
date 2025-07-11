import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormField } from './entities/form-field.entity';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';

@Injectable()
export class FormFieldsService {
  constructor(
    @InjectRepository(FormField)
    private readonly formFieldRepository: Repository<FormField>,
  ) {}

  async create(createFormFieldDto: CreateFormFieldDto): Promise<FormField> {
    try {
      const formField = this.formFieldRepository.create(createFormFieldDto);
      return await this.formFieldRepository.save(formField);
    } catch (error) {
      this.handleError(error, 'Error al crear campo de formulario');
    }
  }

  async findAll(): Promise<FormField[]> {
    try {
      return await this.formFieldRepository.find({ relations: ['form'] });
    } catch (error) {
      this.handleError(error, 'Error al listar campos de formulario');
    }
  }

  async findById(id: string): Promise<FormField> {
    try {
      const field = await this.formFieldRepository.findOne({
        where: { id },
        relations: ['form'],
      });

      if (!field) {
        throw new NotFoundException(`Campo con ID ${id} no encontrado`);
      }

      return field;
    } catch (error) {
      this.handleError(error, 'Error al obtener campo de formulario');
    }
  }

  async update(id: string, updateDto: UpdateFormFieldDto): Promise<FormField> {
    try {
      const field = await this.findById(id);
      Object.assign(field, updateDto);
      return await this.formFieldRepository.save(field);
    } catch (error) {
      this.handleError(error, 'Error al actualizar campo de formulario');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const field = await this.findById(id);
      await this.formFieldRepository.remove(field);
    } catch (error) {
      this.handleError(error, 'Error al eliminar campo de formulario');
    }
  }

  private handleError(error: any, context: string): never {
    console.error(`${context}:`, error.message);
    throw new InternalServerErrorException(context);
  }
}
