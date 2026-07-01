# washon-business — GCP Cloud Run 이전 가이드

## 1. 현재 구조

| 서비스 | 호스팅 |
|--------|--------|
| autoon-home | GCP Cloud Run |
| washon-api | GCP VM |
| washon-business | **Vercel** (`washon-business.vercel.app`) |

## 2. GCP 이전 목표

```
washon-business → GCP Cloud Run (asia-northeast3)
최종 도메인: business.autoon.kr
```

## 3. 필요한 GCP 리소스

| 리소스 | 용도 |
|--------|------|
| **Artifact Registry** | Docker 이미지 저장 (`washon-business` repo) |
| **Cloud Build** | `cloudbuild.yaml`로 이미지 빌드/푸시 |
| **Cloud Run** | `washon-business` 서비스 실행 |
| **Cloud DNS** 또는 **Domain Mapping** | `business.autoon.kr` 연결 |

### Artifact Registry 생성 (1회)

```bash
gcloud artifacts repositories create washon-business \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="washon-business Next.js standalone"
```

## 4. 환경변수

| 변수 | 빌드 시 | 런타임 | Secret | 설명 |
|------|---------|--------|--------|------|
| `NEXT_PUBLIC_API_URL` | **필수** | 권장 | 아니오 | API 베이스 URL (브라우저 노출) |
| `NEXT_PUBLIC_USE_MOCK` | **필수** | 권장 | 아니오 | 운영: `false` |
| `PORT` | - | 자동 | - | Cloud Run이 `8080` 주입 |
| `NODE_ENV` | - | `production` | - | 자동 |

> `NEXT_PUBLIC_*`는 Next.js **빌드 시점**에 클라이언트 번들에 포함됩니다.  
> Docker 빌드 시 `--build-arg`로 전달하거나 `cloudbuild.yaml` substitutions을 사용하세요.

## 5. 첫 배포 절차 (Phase 2)

```bash
# 1. 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 2. API 활성화 (최초 1회)
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com

# 3. 배포 스크립트 실행 권한 (Git Bash / WSL / macOS)
chmod +x scripts/deploy-cloudrun.sh

# 4. 빌드 + 푸시 + Cloud Run 배포
./scripts/deploy-cloudrun.sh
```

또는 빌드만:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## 6. `*.run.app` 테스트 절차

배포 후 출력되는 URL (예: `https://washon-business-xxxxx-an.a.run.app`)에서 확인:

- [ ] `/login` — 사장님 로그인 페이지
- [ ] `/dashboard` — 대시보드 (인증 후)
- [ ] `/admin/login` — 관리자 로그인
- [ ] `/admin/dashboard` — 관리자 대시보드
- [ ] API 호출 정상 (`NEXT_PUBLIC_API_URL` 연결)

## 7. API CORS 추가 필요

`washhon-api` VM의 `CORS_ORIGINS`에 다음을 추가해야 합니다:

```
https://washon-business-xxxxx-an.a.run.app
https://business.autoon.kr
```

현재 기본값에 `https://washon-business.vercel.app`만 포함되어 있을 수 있습니다.

## 8. business.autoon.kr DNS 전환 절차

1. Cloud Run 서비스가 `*.run.app`에서 정상 동작 확인
2. DNS TTL을 사전에 300초 이하로 단축
3. **옵션 A — Cloud Run Domain Mapping** (단순)
   ```bash
   gcloud run domain-mappings create --service=washon-business \
     --domain=business.autoon.kr --region=asia-northeast3
   ```
4. **옵션 B — Global HTTPS Load Balancer** (프로덕션 권장)
   - Serverless NEG → Cloud Run
   - Google-managed SSL
   - `business.autoon.kr` A/AAAA 또는 CNAME 설정
5. 전환 후 `business.autoon.kr/login` 재검증
6. Vercel DNS 연결 해제 (롤백 기간 동안 병행 유지 가능)

## 9. Electron / Capacitor (Phase 3)

**이번 Phase에서는 변경하지 않습니다.**

| 파일 | 현재 URL | Phase 3 변경 |
|------|----------|--------------|
| `electron/main.ts` | `washon-business.vercel.app` | `business.autoon.kr` |
| `capacitor.config.ts` | `washon-business.vercel.app` | `business.autoon.kr` |

변경 후 Electron/Capacitor 앱 **재빌드 및 배포** 필요.

## 10. 롤백 전략

| 방법 | 설명 |
|------|------|
| **Cloud Run Revision** | `gcloud run services update-traffic washon-business --to-revisions=PREV=100` |
| **DNS 롤백** | `business.autoon.kr`을 Vercel로 되돌림 |
| **Vercel 병행** | DNS 전환 전까지 Vercel 유지 → 즉시 롤백 가능 |

## 11. 체크리스트

### Phase 1 (완료)
- [x] `Dockerfile` (Node 20 alpine, standalone)
- [x] `.dockerignore`
- [x] `cloudbuild.yaml`
- [x] `cloudrun.yaml`
- [x] `scripts/deploy-cloudrun.sh`
- [x] `README-GCP.md`
- [x] `npx tsc --noEmit` 통과
- [x] `npm run build` 통과

### Phase 2 (다음)
- [ ] Artifact Registry 생성
- [ ] `gcloud builds submit` 실행
- [ ] Cloud Run 첫 배포
- [ ] `*.run.app` URL 테스트
- [ ] washhon-api CORS 업데이트

### Phase 3
- [ ] `business.autoon.kr` DNS 전환
- [ ] Electron `PROD_URL` 변경 + 재빌드
- [ ] Capacitor URL 변경 + 앱 재배포
- [ ] Vercel 트래픽 종료

## 파일 구조

```
washon-business/
├── Dockerfile              # multi-stage: deps → builder → runner
├── .dockerignore
├── cloudbuild.yaml         # build + push (deploy 주석 처리)
├── cloudrun.yaml           # Knative service 참조
├── scripts/
│   └── deploy-cloudrun.sh  # 수동 배포 스크립트
└── README-GCP.md           # 이 문서
```
