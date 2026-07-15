import { IsIn, IsString, MinLength } from 'class-validator';

/** OAuth2 client-credentials token request body (§34). */
export class TokenRequestDto {
  @IsIn(['client_credentials'])
  grant_type!: 'client_credentials';

  @IsString()
  @MinLength(1)
  client_id!: string;

  @IsString()
  @MinLength(1)
  client_secret!: string;
}
