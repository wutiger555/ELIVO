#!/bin/bash
# 在 Finder 雙擊：啟動 ELIVO 並打開瀏覽器。停止：在終端機執行 bin/elivo stop
"$(dirname "$0")/bin/elivo" start
echo
echo "服務在背景執行，這個視窗可以關掉。"
