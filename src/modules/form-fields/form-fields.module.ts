import { forwardRef, Module } from '@nestjs/common';
import { FormFieldsService } from './form-fields.service';
import { FormFieldsController } from './form-fields.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormField } from './entities/form-field.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { FormsModule } from '../forms/forms.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([FormField]), CacheManagerModule, UsersModule, forwardRef(() => FormsModule)],
  controllers: [FormFieldsController],
  providers: [FormFieldsService],
  exports: [FormFieldsService],
})
export class FormFieldsModule {}
