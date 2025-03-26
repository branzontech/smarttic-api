import { Test, TestingModule } from '@nestjs/testing';
import { AssignedUserBranchService } from './assigned-user-branch.service';

describe('AssignedUserBranchService', () => {
  let service: AssignedUserBranchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignedUserBranchService],
    }).compile();

    service = module.get<AssignedUserBranchService>(AssignedUserBranchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
