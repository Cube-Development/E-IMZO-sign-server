Opt("WinTitleMatchMode", 2) ; 2 = Match partial title

; Получаем PIN из аргументов
Global $PIN = ""
If $CmdLine[0] >= 1 Then
   $PIN = $CmdLine[1]
Else
   MsgBox(0, "Ошибка", "PIN не передан!")
   Exit
EndIf

; Ждем окно
WinWait("Отмена через", "", 10)
If Not WinExists("Отмена через") Then
   MsgBox(0, "Ошибка", "Окно не найдено!")
   Exit
EndIf

Sleep(300) ; Дать окну полностью отрисоваться

; Вводим код
ControlSend("Отмена через", "", "", $PIN)
Sleep(300)

; Нажимаем Enter (OK)
ControlSend("Отмена через", "", "", "{ENTER}")

Sleep(500)
Exit(0)