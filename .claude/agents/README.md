# Agent Rolleri — Nurdle Multi-Agent Sistemi

Claude Code Agent tool ile çalışır. Prompt sonuna `xN` ekleyerek aktive et.

---

## Tier Sistemi

```
Orchestrator (Opus)
    ↓
Principal-Alpha/Beta (Opus) — T1
    ↓
Staff-Engineer-Alpha/Beta (Sonnet) — T1.5
    ↓
MidCoder-Alpha/Beta (Sonnet) — T2
    ↓
Lead-Analyst (Sonnet) — T2.5
    ↓
Analyst-Alpha/Beta/Gamma (Haiku) — T3
```

---

## Agent Rolleri

| Agent | Model | Tier | Rol | Kısıt |
|-------|-------|------|-----|-------|
| `orchestrator` | Opus | L0 | Koordinasyon, task dağıtımı | Kod yazmaz, dosya düzenlemez |
| `principal-alpha` | Opus | T1 | Mimari tasarım, code review | Dosya ownership gerektirir |
| `principal-beta` | Opus | T1 | Paralel mimari (x10) | Principal-alpha ile çelişmez |
| `staff-engineer-alpha` | Sonnet | T1.5 | Feature implementation | Mimari karar veremez |
| `staff-engineer-beta` | Sonnet | T1.5 | Paralel implementation (x7/x10) | Alpha ile aynı dosyayı düzenlemez |
| `mid-coder-alpha` | Sonnet | T2 | API endpoints, boilerplate | Subagent çalıştıramaz |
| `mid-coder-beta` | Sonnet | T2 | Paralel coding (x10) | Alpha ile aynı dosyayı düzenlemez |
| `lead-analyst` | Sonnet | T2.5 | Araştırma koordinasyonu | READ-ONLY |
| `analyst-alpha` | Haiku | T3 | Birincil araştırma | READ-ONLY |
| `analyst-beta` | Haiku | T3 | İkincil araştırma (x7/x10) | READ-ONLY |
| `analyst-gamma` | Haiku | T3 | Üçüncül araştırma (x10) | READ-ONLY |

---

## xN Dağılımı

| Parametre | Principal | Staff Eng | MidCoder | Lead Analyst | Analyst |
|-----------|-----------|-----------|----------|--------------|---------|
| (yok) | — | — | — | — | — |
| `x3` | Alpha | Alpha | — | — | Alpha |
| `x5` | Alpha | Alpha | Alpha | 1 | Alpha |
| `x7` | Alpha | Alpha+Beta | Alpha | 1 | Alpha+Beta |
| `x10` | Alpha+Beta | Alpha+Beta | Alpha+Beta | 1 | Alpha+Beta+Gamma |

---

## Review Zinciri

```
Analyst → Lead Analyst (review)
MidCoder → Staff Engineer (review)
Staff Engineer → Principal (review)
```

Max 2 düzeltme turu. Çözülmezse üst tier devralır.

---

## Circuit Breaker

- Aynı hata 2 kez → farklı yaklaşım
- 3 re-plan döngüsü → kullanıcıya escalate
- 10+ dosya değişikliği → planı böl

---

## Skill Yükleme Rehberi

| Tier | Zorunlu Skill | Opsiyonel |
|------|--------------|-----------|
| T1 (Principal) | clean-code, code-architecture, code-review | frontend, backend, implementation, testing |
| T1.5 (Staff Eng) | clean-code, implementation, code-review | frontend, backend, testing |
| T2 (MidCoder) | clean-code, implementation | frontend, backend |
| T2.5 (Lead Analyst) | analysis, code-review | clean-code |
| T3 (Analyst) | analysis | — |
