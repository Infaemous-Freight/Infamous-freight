import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const validation = require("./validation.js");

export const validateString = validation.validateString;
export const validateEmail = validation.validateEmail;
export const validatePhone = validation.validatePhone;
export const validateUUID = validation.validateUUID;
export const validateUUIDBody = validation.validateUUIDBody;
export const validateEnum = validation.validateEnum;
export const validateEnumQuery = validation.validateEnumQuery;
export const validatePaginationQuery = validation.validatePaginationQuery;
export const handleValidationErrors = validation.handleValidationErrors;

export default validation;
