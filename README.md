# CERNE - Aplicativo de Notas e Desenhos

CERNE é um aplicativo de anotações mobile first construído com React Native e Expo. Ele se destaca por permitir a criação de notas de texto e desenhos à mão livre sincronizados em tempo real via Firebase. O design é inspirado em tons de madeira, refletindo o conceito de "cerne" (núcleo).

## Visão Geral do Projeto

| Característica | Descrição |
|----------------|-----------|
| **Recursos Chave** | Criação, Edição, Exclusão de Notas de Texto e Desenhos Vetoriais (SVG) |
| **Persistência** | Firebase (Authentication, Firestore, Storage) |
| **Navegação** | Expo Router (Roteamento baseado em arquivos) |
| **Design** | Paleta de cores centralizada com tons de marrom (theme.js) |
| **Complexidade** | Implementação de Borracha Inteligente no DrawingCanvas |

## Tecnologias Principais

O projeto utiliza um stack moderno e performático para desenvolvimento mobile:

- **Framework**: React Native (v0.81.5)
- **Plataforma**: Expo (v54.0.20)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Componentes**: react-native-svg (para desenhos)
- **Estado Local**: AsyncStorage (para "lembrar-me")
- **Roteamento**: expo-router

## Estrutura de Arquivos

A organização segue o padrão do Expo Router, onde a lógica da aplicação está embutida na estrutura de rotas.
