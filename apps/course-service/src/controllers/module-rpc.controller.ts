import { Controller } from '@nestjs/common';
import { ModuleRpcService } from '../services/module-rpc.service';

@Controller()
export class ModuleRpcController {
  constructor(private readonly moduleRpcService: ModuleRpcService) {}
}
