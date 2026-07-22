# Phase 1 stub — replaced with multi-stage production build in a later phase
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev || true

COPY . .

EXPOSE 5001

# Placeholder until appointment microservice is implemented
CMD ["node", "-e", "require('http').createServer((_, res) => { res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'ok',service:'appointment-service',phase:1})); }).listen(process.env.PORT || 5001, () => console.log('appointment-service stub listening'))"]
