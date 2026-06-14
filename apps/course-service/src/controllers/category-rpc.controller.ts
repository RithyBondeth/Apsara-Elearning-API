import { Controller } from '@nestjs/common';
import { CategoryRpcService } from '../services/category-rpc.service';

@Controller()
export class CategoryRpcController {
  constructor(private readonly categoryRpcService: CategoryRpcService) {}
}
