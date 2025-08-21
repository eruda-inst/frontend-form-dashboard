export type User = {
  id: string;
  nome: string;
  email: string;
  imagem: string;
  grupo: {
    id: string;
    nome: string;
  };
  username: string;
  genero: string;
  ativo: boolean;
  criado_em: string;
};