Modal panel over a blurred overlay; used for post-meeting confirm and consent notice.
```jsx
<Dialog title="確認本場決策" description="30 秒確認後寫入 Decision Ledger" onClose={close}
  footer={<><Button variant="ghost">稍後</Button><Button variant="primary">寫入 Ledger</Button></>}>…</Dialog>
```
