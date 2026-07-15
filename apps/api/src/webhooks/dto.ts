import { ArrayNotEmpty, IsArray, IsString, IsUrl } from 'class-validator';

export class CreateWebhookEndpointDto {
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  url!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events!: string[];
}
