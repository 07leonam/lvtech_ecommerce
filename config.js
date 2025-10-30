// Configurações do Projeto
const CONFIG = {
    MERCADO_PAGO_PUBLIC_KEY: "SUA_CHAVE_PUBLICA_DO_MERCADO_PAGO_AQUI", // Substitua pela sua chave pública
    MERCADO_PAGO_ACCESS_TOKEN: "SEU_ACCESS_TOKEN_DO_MERCADO_PAGO_AQUI", // Substitua pelo seu access token (apenas para backend)
    // Outras configurações...
};

// Exporta as configurações para uso em outros módulos
// (Se o projeto for puramente frontend, a chave privada não deve ser exposta)
// Vamos considerar que o projeto terá um backend simples para processar o checkout
// Por enquanto, apenas a chave pública é necessária no frontend.
// A chave de acesso será usada no backend.

// Para o frontend, exportamos a chave pública
const getPublicKey = () => CONFIG.MERCADO_PAGO_PUBLIC_KEY;

// Para o backend, exportamos o access token (se necessário, mas o backend.js já está estruturado)
// const getAccessToken = () => CONFIG.MERCADO_PAGO_ACCESS_TOKEN;

// Se for necessário usar o config.js no frontend, descomente a linha abaixo
// export { getPublicKey };

// Por enquanto, vamos manter a chave pública no script de checkout.
// Este arquivo será usado para centralizar configurações futuras.

// Para fins de demonstração, vamos apenas criar o arquivo.
// A chave pública será inserida diretamente no checkout.js para simplificar a demonstração frontend.
// Em um ambiente de produção, a chave pública deve ser carregada de forma segura.

// Conteúdo final do config.js:
const MERCADO_PAGO_PUBLIC_KEY = "SUA_CHAVE_PUBLICA_DO_MERCADO_PAGO_AQUI";
// A chave pública será usada no checkout.js
// A chave privada (access token) será usada no backend.js
