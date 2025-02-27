export const responseSuccess = (
  metaData: any = null,
  message: string = 'oke',
  code: number = 200,
) => {
  return {
    status: 'success',
    code: code,
    message: message,
    metaData: metaData,
    documentApi: 'http://localhost:4000/docs',
  };
};

export const responseError = (
  message: string = 'Internal Server Error',
  code: number = 500,
  stack: any = null,
) => {
  return {
    status: 'error',
    code: code,
    message: message,
    stack: stack,
  };
};
