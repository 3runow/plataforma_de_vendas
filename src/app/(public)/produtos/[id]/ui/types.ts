export type Color = { name: string; value: string };

export type Address = {
  cep: string;
  logradouro: string;
  complemento?: string | null;
  bairro: string;
  localidade: string;
  uf: string;
};


