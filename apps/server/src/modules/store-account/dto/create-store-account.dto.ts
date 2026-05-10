import { IsString, MinLength } from 'class-validator';

export class CreateStoreAccountDto {
  @IsString()
  @MinLength(1)
  storeName: string;

  @IsString()
  ozonClientId: string;

  @IsString()
  ozonApiKey: string;
}
