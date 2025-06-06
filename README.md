# HZM-WeChat-Miniapp

This project is a WeChat Mini Program built with **Taro** and **React** using TypeScript.
It provides car related ticketing and order management features.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or later is recommended)
- npm or [Yarn](https://yarnpkg.com/)
- [WeChat Developer Tools](https://developers.weixin.qq.com/miniprogram/en/dev/devtools/download.html)

## Installation

Install the dependencies with your preferred package manager:

```bash
npm install
# or
yarn install
```

## Development

To run the project in development mode for the WeChat mini program environment:

```bash
npm run dev:weapp
```

This starts Taro in watch mode and outputs the compiled files to the `dist/` folder.
Open the `dist/` directory with the WeChat Developer Tools to preview the mini program.

## Build

To create a production build for WeChat:

```bash
npm run build:weapp
```

The optimized files will be generated in the `dist/` directory.

## Project Structure

- `src/` – Source code for pages, components and utilities
- `config/` – Taro configuration files for development and production
- `static/` – Static assets copied into the output directory

## References

- [Taro Documentation](https://docs.taro.zone/)

