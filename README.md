# Salmon Allocation

หน้า admin สำหรับจัดสรรปลาแซลมอนให้ order ตาม priority + stock + credit ของลูกค้า

Live: https://spuict.web.app/

## Stack

- Vite + React + TypeScript
- Tailwind v4 + shadcn/ui
- Zustand
- TanStack Query
- TanStack Table + TanStack Virtual
- React Router v6

## ที่ทำได้

- เปิดหน้าแล้ว auto allocate ให้เลย จัด Emergency ก่อน แล้ว Overdue แล้ว Daily
- ใน type เดียวกันใช้ FIFO (order เก่ามาก่อน)
- WH-000 / SP-000 = ใช้ที่ไหนก็ได้ เลือกตัวที่มี stock เหลือเยอะสุด
- ราคา = base * tier (Emergency 125%, Overdue 100%, Daily 90%) ใช้ banker rounding 2 ตำแหน่ง
- กดแก้ allocated เองได้ ถ้าใส่เกิน stock หรือ credit ระบบจะ clamp ให้
- mock data 5,200 sub orders, table virtualized

## รัน local

```
npm install
npm run dev
```

## Build + deploy

```
npm run build
firebase deploy --only hosting
```

## โครงสร้าง

```
src/
  app/             providers, routes
  components/
    ui/            shadcn
    layout/        sidebar, header
    common/        data-table, page-header, stat-card
  features/
    allocation/
      api/         mock data
      lib/         banker round, auto allocate
      hooks/       store + query
      components/  cells, table, toolbar, stats
  hooks/           use-theme, use-mobile
  lib/             utils, format, query-client
  stores/          ui store
```

## Logic การทำงาน

### 1. ตอนเปิดหน้า

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Page as AllocationPage
  participant Query as TanStack Query
  participant API as Mock API
  participant Algo as autoAllocate
  participant Store as Zustand Store
  participant Cells as Table Cells

  User->>Page: open /
  par 5 parallel queries
    Page->>Query: useQuery orders
    Query->>API: fetchOrders
    API-->>Query: 5200 orders
  and
    Page->>Query: useQuery customers
    Query->>API: fetchCustomers
    API-->>Query: 500 customers + credit
  and
    Page->>Query: useQuery prices
    Query->>API: fetchPrices
    API-->>Query: base prices per item+supplier
  and
    Page->>Query: useQuery tiers
    Query->>API: fetchPriceTiers
    API-->>Query: EMERGENCY 125, OVER_DUE 100, DAILY 90
  and
    Page->>Query: useQuery stock
    Query->>API: fetchStock
    API-->>Query: stock pools
  end
  Query-->>Page: isReady true
  Page->>Page: setTimeout 0 so loading paints
  Page->>Algo: autoAllocate of all data
  Algo-->>Page: result Map of 5200 entries
  Page->>Store: hydrate result
  Store-->>Cells: subscribers notified
  Cells-->>User: rendered allocation
```

### 2. autoAllocate วนทีละ order

```mermaid
flowchart TD
  In([input: orders, customers, prices, tiers, stock]) --> Build[build lookup maps<br/>tierMap, basePriceMap<br/>remainingStock per WH+SP+Item<br/>remainingCredit per customer]
  Build --> Sort[sort orders<br/>by priority rank EMERGENCY 0, OVER_DUE 1, DAILY 2<br/>then by createDate ASC for FIFO]
  Sort --> Take([take next order])
  Take --> WHany{warehouseId == WH-000?}
  WHany -->|yes| WHall[whCandidates = all warehouses]
  WHany -->|no| WHone[whCandidates = single]
  WHall --> SPany{supplierId == SP-000?}
  WHone --> SPany
  SPany -->|yes| SPall[spCandidates = all suppliers]
  SPany -->|no| SPone[spCandidates = single]
  SPall --> Scan
  SPone --> Scan
  Scan[for each wh x sp combo<br/>read remainingStock at WH+SP+Item<br/>track best = max stock where stock > 0]
  Scan --> HasPool{best pool found?}
  HasPool -->|no| Zero[allocation = 0<br/>unitPrice = 0]
  HasPool -->|yes| Price[base = basePriceMap at item+best.sp<br/>unitPrice = bankerRound base * tier]
  Price --> Caps[stockCap = best.stock<br/>creditCap = remainingCredit / unitPrice]
  Caps --> Qty[qty = min request, stockCap, creditCap<br/>qty = bankerRound qty<br/>qty = max 0, qty]
  Qty --> Total[total = bankerRound qty * unitPrice]
  Total --> Update{qty > 0?}
  Update -->|yes| Dec[remainingStock at pool -= qty<br/>remainingCredit at customer -= total]
  Update -->|no| Save
  Dec --> Save
  Zero --> Save
  Save[allocations.set subOrderId<br/>= qty, pool, unitPrice, total]
  Save --> More{more orders?}
  More -->|yes| Take
  More -->|no| Out([return allocations + remaining maps])
```

### 3. ตอน user แก้ allocated เอง

```mermaid
flowchart TD
  Key[user types value v] --> Local[useState local in cell<br/>store NOT touched]
  Local --> Wait{blur or Enter?}
  Wait -->|no, keep typing| Key
  Wait -->|yes| Parse[parsed = Number v]
  Parse --> Valid{finite and != current?}
  Valid -->|no| Reset[reset local to current qty]
  Valid -->|yes| Call[call setAllocation order, newQty]
  Call --> Read[current = allocations.get subOrderId<br/>unitPrice = current.unitPrice<br/>poolKey = wh + sp + item]
  Read --> Budget[stockBudget = remainingStock + currentQty<br/>creditBudget = remainingCredit + currentTotal<br/>maxByCredit = creditBudget / unitPrice]
  Budget --> Limit[limit = min request, stockBudget, maxByCredit]
  Limit --> Round[clamped = bankerRound min newQty, limit, 2]
  Round --> Diff{clamped < newQty?}
  Diff -->|yes| Why[reason =<br/>limit == request: cannot exceed request<br/>limit == stockBudget: pool only has X<br/>else: credit allows max X]
  Why --> Toast[toast.warning clamped + reason]
  Diff -->|no| Write
  Toast --> Write
  Write[clone 3 Maps and set new values<br/>allocations<br/>remainingStock<br/>remainingCredit]
  Write --> Notify[set new store state]
  Notify --> Selectors[Zustand fires selectors<br/>for all subscribers]
  Selectors --> RowEdited[Row A: entry ref changed<br/>cells re-render with new value]
  Selectors --> RowOther[Row B: entry ref unchanged<br/>Object.is true<br/>cells skip re-render]
  Selectors --> StatsCard[Stats card: totals changed<br/>re-render]
```

### 4. การกัน re-render

```mermaid
flowchart LR
  subgraph store [Zustand Store]
    Map[allocations Map]
  end

  subgraph rowA [Row A subOrderId X]
    Ax[allocated input]
    Ay[total cell]
    Az[status badge]
  end

  subgraph rowB [Row B subOrderId Y]
    Bx[allocated input]
    By[total cell]
    Bz[status badge]
  end

  subgraph stats [Stats Card]
    Sc[totals selector with useShallow]
  end

  Edit[edit Row A from 10 to 20]
  Edit --> Map
  Map -->|selector X| Ax
  Map -->|selector X| Ay
  Map -->|selector X| Az
  Map -->|selector Y| Bx
  Map -->|selector Y| By
  Map -->|selector Y| Bz
  Map -->|totals reducer| Sc

  Ax -->|new ref| RA[re-render]
  Ay -->|new ref| RA
  Az -->|new ref| RA
  Bx -->|same ref| SB[Object is true, skip]
  By -->|same ref| SB
  Bz -->|same ref| SB
  Sc -->|totals changed| RS[re-render stats]
```
