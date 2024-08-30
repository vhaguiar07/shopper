# Desafio Shopper

## Resumo

Objetivo: desenvolver o back-end de um serviço que gerencia a leitura individualizada de consumo de água e gás. Deverá ser desenvolvida uma API REST em Node.js com TypeScript, em um container Docker.

Candidato: Victor Aguiar

Acesse o back-end da aplicação pelo endereço http://localhost:8080. Garanta que as portas 8080 (back-end) e 5432 (Postgres) estejam disponíveis.

A aplicação foi desenvolvida em containers (back-end em Nest.js, banco de dados com PostgreSQL e um container para testes). Para facilitar a utilização e compreensão das rotas arquitetadas, fiz a documentação delas com Swagger. A documentação está disponível em http://localhost:8080/docs

## Requisitos

- docker
- docker-compose

## Entregáveis

### POST /upload

#### Responsável por receber uma imagem em base 64, consultar o Gemini e retornar a medida lida pela API

_Validar o tipo de dados dos parâmetros enviados (inclusive o base64)_ - Esse requisito foi atendido com o Status 400 - "Os dados fornecidos no corpo da requisição são inválidos"

_Verificar se já existe uma leitura no mês naquele tipo de leitura._ - Esse requisito foi atendido com o Status 409 - "Já existe uma leitura para este tipo no mês atual"

_Integrar com uma API de LLM para extrair o valor da imagem_ - A integração foi feita com a API Vision do Google. Fiz com que a extração do valor da imagem leve em consideração sempre o número com maior destaque na imagem. Ou seja, se por acaso a imagem tiver números em diferentes locais, o código procurará sempre o maior para retornar

### PATCH /confirm

#### Responsável por confirmar ou corrigir o valor lido pelo LLM,

_Validar o tipo de dados dos parâmetros enviados_ - Esse requisito foi atendido com o Status 400. Caso algum dado na requisição esteja errado (nome do campo errado, UUID inválido, uma string ao invés de um número para o valor a ser confirmado) - "Os dados fornecidos no corpo da requisição são inválidos"

_Verificar se o código de leitura informado existe_ - Esse requisito foi atendido com o Status 404. Caso a requisição tenha um UUID válido, mas não existente no banco de dados - "Leitura não encontrada"

_Verificar se o código de leitura já foi confirmado_ - Esse requisito foi atendido com o Status 409 - "Leitura já confirmada" 

_Salvar no banco de dados o novo valor informado_ - Após uma requisição bem sucedida (Status 200), o banco de dados atualiza o campo "confirmed_value" com o valor inserido na requisição (obs, ele NÃO altera o valor antigo de measure_value, ele simplesmente insere o novo valor em outro campo), e atualiza o valor do campo boolean "confirmed".

### GET /`<customer_code>`/list

#### Responsável por listar as medidas realizadas por um determinado cliente

_Receber o código do cliente e filtrar as medidas realizadas por ele_ - A requisição retorna um array com todas as medições realizadas pelo cliente.

_Ele opcionalmente pode receber um query parameter “measure_type”, que deve ser “WATER” ou “GAS”_ - A requisição pode receber opcionalmente na URL o valor measure_type, sendo case insensitive.

### Testes unitários

Foram escritos alguns testes para os serviços. Eles podem ser executados pelo container de teste.

## Iniciar a stack localmente

```shell
make up
```

## Derrubar a stack localmente

```shell
make down
```

> [!NOTE]
> Por se tratar de uma arquitetura mais simples, o banco de dados Postgres foi implementado sem ORM. Porém, poderia também optar por utilizar o Prisma por exemplo.