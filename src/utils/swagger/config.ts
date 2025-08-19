import { SignDocumentSchema } from "../../modules/sign-didox/dto";
import { CreateSignDidoxDocumentSwagger } from "../../modules/sign-didox/sign.swagger";
import { ENUM_REGISTER_ROUTE } from "./register.enum";

export const SWAGGER_ROUTES = [CreateSignDidoxDocumentSwagger] 

export const SWAGGER_SCHEMAS = [
  {
    name:ENUM_REGISTER_ROUTE.SIGN_DOCUMENT_DIDOX,
    schema: SignDocumentSchema
  }
];