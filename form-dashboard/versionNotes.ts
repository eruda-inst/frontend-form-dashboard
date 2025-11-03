import packageJson from "./package.json"

export const versionString = `v${packageJson.version} Alpha`
export const versionNotes = `
## Histórico de Versões

### Versão 0.10.0α - 03 de Outubro de 2025

#### ✨ Novas Funcionalidades

*   **Exportação de Dados Aprimorada:** Agora você pode exportar os dados dos seus formulários em múltiplos formatos, incluindo CSV, NDJSON e XLSX. A nova tela de exportação permite selecionar um intervalo de datas, fuso horário e outras opções para personalizar seu arquivo.
*   **Notas de Versão em Markdown:** As notas de versão agora são renderizadas a partir de markdown, permitindo uma visualização mais rica e organizada das novidades.

#### 🗑️ Remoções

*   **Etapa de Adicionar Perguntas Removida:** O segundo passo na criação de um formulário, onde era possível adicionar perguntas, foi removido para simplificar o fluxo. Agora, o usuário é redirecionado para a página de edição do formulário após a sua criação.

---

### Versão 0.9.2α - 28 de Outubro de 2025

#### ✨ Novas Funcionalidades

*   **Blocos de Perguntas:** Organize seus formulários de maneira mais eficiente com a adição de blocos. Agrupe perguntas relacionadas para uma melhor estrutura e experiência do usuário.
*   **Novos Tipos de Pergunta:** Adicionamos suporte para os tipos de pergunta Telefone, CNPJ e E-mail, permitindo uma coleta de dados mais específica e validada.

`