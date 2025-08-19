Opt("WinTitleMatchMode", 2) ; 2 = Match partial title

; Получаем PIN из аргументов
Global $PIN = ""
If $CmdLine[0] >= 1 Then
   $PIN = $CmdLine[1]
Else
   MsgBox(0, "Ошибка", "PIN не передан!")
   Exit
EndIf

ConsoleWrite("✅ Демон запущен. Жду окна..." & @CRLF)

While True
   ; Проверяем, существует ли окно
   If WinExists("Отмена через") Then
       ; Вводим PIN напрямую в окно (без активации)
       ControlSend("Отмена через", "", "", $PIN)
       Sleep(300)

       ; Нажимаем Enter (OK)
       ControlSend("Отмена через", "", "", "{ENTER}")

       Sleep(500)

       ConsoleWrite("✔ Окно обработано." & @CRLF)
   EndIf

   ; Пауза, чтобы не грузить CPU
   Sleep(500)
WEnd