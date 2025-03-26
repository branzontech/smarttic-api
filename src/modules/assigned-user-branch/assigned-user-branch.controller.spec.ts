import { Test, TestingModule } from '@nestjs/testing';
import { AssignedUserBranchController } from './assigned-user-branch.controller';
import { AssignedUserBranchService } from './assigned-user-branch.service';

describe('AssignedUserBranchController', () => {
  let controller: AssignedUserBranchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignedUserBranchController],
      providers: [AssignedUserBranchService],
    }).compile();

    controller = module.get<AssignedUserBranchController>(AssignedUserBranchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
