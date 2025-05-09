/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as authLayoutImport } from './routes/(auth)/_layout'
import { Route as IndexImport } from './routes/index'
import { Route as authSignupImport } from './routes/(auth)/signup'
import { Route as authLoginImport } from './routes/(auth)/login'

// Create/Update Routes

const authLayoutRoute = authLayoutImport.update({
  id: '/(auth)',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const authSignupRoute = authSignupImport.update({
  id: '/signup',
  path: '/signup',
  getParentRoute: () => authLayoutRoute,
} as any)

const authLoginRoute = authLoginImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => authLayoutRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/(auth)': {
      id: '/(auth)'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof authLayoutImport
      parentRoute: typeof rootRoute
    }
    '/(auth)/login': {
      id: '/(auth)/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof authLoginImport
      parentRoute: typeof authLayoutImport
    }
    '/(auth)/signup': {
      id: '/(auth)/signup'
      path: '/signup'
      fullPath: '/signup'
      preLoaderRoute: typeof authSignupImport
      parentRoute: typeof authLayoutImport
    }
  }
}

// Create and export the route tree

interface authLayoutRouteChildren {
  authLoginRoute: typeof authLoginRoute
  authSignupRoute: typeof authSignupRoute
}

const authLayoutRouteChildren: authLayoutRouteChildren = {
  authLoginRoute: authLoginRoute,
  authSignupRoute: authSignupRoute,
}

const authLayoutRouteWithChildren = authLayoutRoute._addFileChildren(
  authLayoutRouteChildren,
)

export interface FileRoutesByFullPath {
  '/': typeof authLayoutRouteWithChildren
  '/login': typeof authLoginRoute
  '/signup': typeof authSignupRoute
}

export interface FileRoutesByTo {
  '/': typeof authLayoutRouteWithChildren
  '/login': typeof authLoginRoute
  '/signup': typeof authSignupRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/(auth)': typeof authLayoutRouteWithChildren
  '/(auth)/login': typeof authLoginRoute
  '/(auth)/signup': typeof authSignupRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/login' | '/signup'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/login' | '/signup'
  id: '__root__' | '/' | '/(auth)' | '/(auth)/login' | '/(auth)/signup'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  authLayoutRoute: typeof authLayoutRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  authLayoutRoute: authLayoutRouteWithChildren,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/(auth)"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/(auth)": {
      "filePath": "(auth)/_layout.tsx",
      "children": [
        "/(auth)/login",
        "/(auth)/signup"
      ]
    },
    "/(auth)/login": {
      "filePath": "(auth)/login.tsx",
      "parent": "/(auth)"
    },
    "/(auth)/signup": {
      "filePath": "(auth)/signup.tsx",
      "parent": "/(auth)"
    }
  }
}
ROUTE_MANIFEST_END */
