import { Test, TestingModule } from '@nestjs/testing';
import { AssignedMenuRoleService } from './assigned-menu-role.service';

describe('AssignedMenuRoleService', () => {
  let service: AssignedMenuRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignedMenuRoleService],
    }).compile();

    service = module.get<AssignedMenuRoleService>(AssignedMenuRoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
