import { forwardRef, Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Form } from './entities/form.entity';
import { CacheManagerModule } from 'src/common/cache-manager/cache-manager.module';
import { FormFieldsModule } from '../form-fields/form-fields.module';
import { FormField } from '../form-fields/entities/form-field.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Form, FormField]), CacheManagerModule, UsersModule, forwardRef(() => FormFieldsModule)],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
