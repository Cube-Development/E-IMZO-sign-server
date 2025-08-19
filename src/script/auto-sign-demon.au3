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
        ; Активируем окно
        WinActivate("Отмена через")
        WinWaitActive("Отмена через")
        
        Sleep(300) ; Дать окну полностью отрисоваться

        ; Вводим PIN
        Send($PIN)
        Sleep(300)

        ; Нажимаем Enter (OK)
        Send("{ENTER}")

        Sleep(500)

        ConsoleWrite("✔ Окно обработано." & @CRLF)
    EndIf

    ; Пауза, чтобы не грузить CPU
    Sleep(500)
WEnd
