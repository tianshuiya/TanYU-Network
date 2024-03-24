# Node.js 应用程序 API 使用手册

## 概述

本文档提供了对 Node.js 应用程序中实现的 API 端点的详细描述。这些 API 端点用于处理各种请求，包括但不限于卡片验证、用户认证、IP 管理等。

## 卡片处理

### 卡片验证 (`/api/card`)
- **请求方式**：POST
- **请求头**：
  ```
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "card": "卡号",
    "use": "用途",
    "token": "管理员令牌（如果需要）"
  }
  ```
  - `card`: 卡号字符串。
  - `use`: 卡号的用途，例如 `'Admin.Pat'` 或 `'Pat.test'`。
  - `token`: (可选) 用于验证的管理员令牌。
- **响应**：
  - **成功**：状态码 200，响应体包含处理结果
  - **失败**：状态码 403 或 404，响应体包含错误信息

## 用户认证

### 用户登录 (`/api/auth/login`)
- **请求方式**：POST
- **请求头**：
  ```
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```
  - `username`: 用户名。
  - `password`: 密码。
- **响应**：
  - **成功**：状态码 200，响应体包含登录成功信息和令牌
  - **失败**：状态码 403 或 404，响应体包含错误信息

### 用户创建 (`/api/auth`)
- **请求方式**：POST
- **请求头**：
  ```
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "username": "新用户名",
    "password": "新用户密码",
    "token": "创建用户的令牌",
    "permission": "新用户权限级别（数值）"
  }
  ```
  - `username`: 新用户名。
  - `password`: 新用户密码。
  - `token`: 创建用户的令牌。
  - `permission`: 新用户权限级别（数值）。
- **响应**：
  - **成功**：状态码 200，响应体包含创建成功信息
  - **失败**：状态码 403 或 500，响应体包含错误信息

### 用户搜索 (`/api/auth/search`)
- **请求方式**：POST
- **请求头**：
  ```
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "username": "要搜索的用户名（可选）",
    "token": "用于验证的令牌"
  }
  ```
  - `username`: 要搜索的用户名（可选）。
  - `token`: 用于验证的令牌。
- **响应**：
  - **成功**：状态码 200，响应体包含找到的用户列表
  - **失败**：状态码 403 或 500，响应体包含错误信息

## 静态文件服务

### 服务请求 (`/`)
- **请求方式**：GET
- **请求头**：无特定要求
- **请求路径**：`/` 或 `/index.html`（自动重定向）
- **响应**：
  - **成功**：状态码 200，返回请求的文件内容
  - **失败**：状态码 404，响应体包含错误信息

## 其他

### 未知请求处理
- 对于未定义的请求路径，服务器将返回状态码 404 和错误信息。