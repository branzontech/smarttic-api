import { Test, TestingModule } from '@nestjs/testing';
import { FormFieldsController } from './form-fields.controller';
import { FormFieldsService } from './form-fields.service';

describe('FormFieldsController', () => {
  let controller: FormFieldsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormFieldsController],
      providers: [FormFieldsService],
    }).compile();

    controller = module.get<FormFieldsController>(FormFieldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
