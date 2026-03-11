

## Problema

O sidebar já tem lógica de colapso interno (estado `collapsed`, botão de toggle), mas o `main` em `App.tsx` tem margem fixa `ml-60`, então ao recolher o sidebar o conteúdo não se ajusta — fica um espaço vazio.

## Plano

1. **Compartilhar estado de colapso via Context** — Criar um contexto `SidebarContext` (ou usar um simples state elevado) para que `AppSidebar` e `App.tsx` compartilhem o estado `collapsed`.

2. **Ajustar `AppSidebar`** — Consumir o contexto ao invés de `useState` local. Exportar o provider.

3. **Ajustar `App.tsx`** — Envolver com o `SidebarProvider` e fazer a `main` usar `ml-16` quando colapsado e `ml-60` quando expandido, com `transition-all duration-200` para animar suavemente.

4. **Remover `useAppSidebarWidth`** — Substituir pelo contexto.

Resultado: clicar no botão de seta no rodapé do sidebar recolhe o menu para mostrar apenas ícones, e o conteúdo principal expande automaticamente com transição suave.

