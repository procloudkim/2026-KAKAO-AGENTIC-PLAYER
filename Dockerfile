# Canonical image definition. Build with the repository root as the context.
FROM node:22-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS build

WORKDIR /app

COPY apps/family-experience-mcp/package.json apps/family-experience-mcp/package-lock.json ./
RUN npm ci

COPY apps/family-experience-mcp/tsconfig.json apps/family-experience-mcp/tsconfig.build.json ./
COPY apps/family-experience-mcp/src ./src
RUN npm run build

FROM node:22-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3349
ENV FAMILY_EXPERIENCE_ALLOW_FIXTURE=false
ENV FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache
ENV FAMILY_EXPERIENCE_SOURCE_SET=kto_tourapi
ENV FAMILY_EXPERIENCE_ETL_TTL_HOURS=24

COPY apps/family-experience-mcp/package.json apps/family-experience-mcp/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist/src ./dist/src
COPY apps/family-experience-mcp/data ./data

EXPOSE 3349

USER node

STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "const http=require('node:http');const port=Number(process.env.PORT||3349);const req=http.get({host:'127.0.0.1',port,path:'/health',timeout:4000},res=>{const ok=res.statusCode===200;res.resume();process.exit(ok?0:1);});req.on('error',()=>process.exit(1));req.on('timeout',()=>req.destroy());"

CMD ["node", "dist/src/server.js"]
