# HFT Demo — backend (C++ engine + Python API) for Render / Docker
FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY cpp/ cpp/
COPY scripts/build.sh scripts/build.sh
RUN chmod +x scripts/build.sh && bash scripts/build.sh

COPY python/requirements.txt python/requirements.txt
RUN pip install --no-cache-dir -r python/requirements.txt

COPY python/ python/
COPY scripts/start-backend.sh scripts/start-backend.sh
RUN chmod +x scripts/start-backend.sh

ENV HFT_ENGINE_HOST=127.0.0.1
ENV HFT_ENGINE_PORT=9001
ENV HFT_DEMO=1
ENV HFT_SYMBOL=AAPL

EXPOSE 8000

CMD ["bash", "scripts/start-backend.sh"]
