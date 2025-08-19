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
       ; Сначала пробуем ControlSetText
       ControlSetText("Отмена через", "", "", $PIN)
       Sleep(200)
       
       ; Если не сработало, используем медленный ввод
       Local $currentText = ControlGetText("Отмена через", "", "")
       If $currentText <> $PIN Then
           ControlSetText("Отмена через", "", "", "")
           Sleep(100)
           For $i = 1 To StringLen($PIN)
               ControlSend("Отмена через", "", "", StringMid($PIN, $i, 1))
               Sleep(50)
           Next
       EndIf
       
       Sleep(300)
       ControlSend("Отмена через", "", "", "{ENTER}")
       Sleep(500)
       
       ConsoleWrite("✔ Окно обработано." & @CRLF)
   EndIf

   ; Пауза, чтобы не грузить CPU
   Sleep(500)
WEnd