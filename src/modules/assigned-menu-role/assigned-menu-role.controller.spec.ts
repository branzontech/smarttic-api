import { Test, TestingModule } from '@nestjs/testing';
import { AssignedMenuRoleController } from './assigned-menu-role.controller';
import { AssignedMenuRoleService } from './assigned-menu-role.service';

describe('AssignedMenuRoleController', () => {
  let controller: AssignedMenuRoleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignedMenuRoleController],
      providers: [AssignedMenuRoleService],
    }).compile();

    controller = module.get<AssignedMenuRoleController>(AssignedMenuRoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
