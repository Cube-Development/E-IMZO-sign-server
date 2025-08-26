Opt("WinTitleMatchMode", 2) ; Частичное совпадение заголовка

; Получаем PIN из аргументов
Global $PIN = ""
If $CmdLine[0] >= 1 Then
   $PIN = $CmdLine[1]
Else
   ConsoleWrite("ERROR: PIN not provided!" & @CRLF)
   Exit 1
EndIf

; Заголовок целевого окна
Global $TARGET_WINDOW = "Отмена через"

ConsoleWrite("AutoIt Password Demon started" & @CRLF)
ConsoleWrite("Target window: " & $TARGET_WINDOW & @CRLF)
ConsoleWrite("PIN length: " & StringLen($PIN) & " chars" & @CRLF)
ConsoleWrite("Waiting for window..." & @CRLF)

While True
   ; Проверяем существование целевого окна
   If WinExists($TARGET_WINDOW) Then
       Local $windowHandle = WinGetHandle($TARGET_WINDOW)
       Local $windowTitle = WinGetTitle($windowHandle)
       
       ConsoleWrite("FOUND: " & $windowTitle & " (Handle: " & $windowHandle & ")" & @CRLF)
       
       ; Пытаемся найти поле ввода в окне
       Local $success = False
       Local $inputText = ""
       Local $attempts = 0
       Local $maxAttempts = 3
       
       ; Вариант 1: Поиск поля Edit
       If ControlCommand($windowHandle, "", "[CLASS:Edit; INSTANCE:1]", "IsEnabled") Then
           ConsoleWrite("Found Edit control, sending password..." & @CRLF)
           
           ; Повторяем попытки ввода до 3 раз
           While $attempts < $maxAttempts And Not $success
               $attempts += 1
               ConsoleWrite("Attempt #" & $attempts & " to input PIN" & @CRLF)
               
               ; Очищаем поле
               ControlSend($windowHandle, "", "[CLASS:Edit; INSTANCE:1]", "^a")
               Sleep(50)
               ControlSend($windowHandle, "", "[CLASS:Edit; INSTANCE:1]", "{DELETE}")
               Sleep(100)
               
               ; Вводим пароль посимвольно
               For $i = 1 To StringLen($PIN)
                   ControlSend($windowHandle, "", "[CLASS:Edit; INSTANCE:1]", StringMid($PIN, $i, 1))
                   Sleep(50)
               Next
               
               ; Проверяем что ввелось в поле
               Sleep(150)
               $inputText = ControlGetText($windowHandle, "", "[CLASS:Edit; INSTANCE:1]")
               
               ; Проверяем длину введенного текста
               If StringLen($inputText) = StringLen($PIN) Then
                   ConsoleWrite("SUCCESS: Input length matches PIN length (" & StringLen($inputText) & ") on attempt #" & $attempts & @CRLF)
                   ControlSend($windowHandle, "", "[CLASS:Edit; INSTANCE:1]", "{ENTER}")
                   $success = True
               Else
                   ConsoleWrite("RETRY: Input length mismatch on attempt #" & $attempts & ". Expected: " & StringLen($PIN) & ", Got: " & StringLen($inputText) & @CRLF)
                   ConsoleWrite("Input content: '" & $inputText & "'" & @CRLF)
                   Sleep(200) ; Пауза перед повторной попыткой
               EndIf
           WEnd
           
           If Not $success Then
               ConsoleWrite("ERROR: Failed to input correct PIN length after " & $maxAttempts & " attempts" & @CRLF)
           EndIf
           
       ; Вариант 2: Если Edit не найден, пробуем отправить напрямую в окно
       ElseIf WinExists($windowHandle) Then
           ConsoleWrite("Edit control not found, trying direct window send..." & @CRLF)
           
           ; Очищаем
           ControlSend($windowHandle, "", "", "^a")
           Sleep(50)
           ControlSend($windowHandle, "", "", "{DELETE}")
           Sleep(100)
           
           ; Вводим пароль посимвольно
           For $i = 1 To StringLen($PIN)
               ControlSend($windowHandle, "", "", StringMid($PIN, $i, 1))
               Sleep(50)
           Next
           
           ; Для варианта 2 не можем проверить длину, отправляем Enter
           Sleep(100)
           ControlSend($windowHandle, "", "", "{ENTER}")
           $success = True
           ConsoleWrite("WARNING: Cannot verify input length for direct window send" & @CRLF)
       EndIf
       
       If $success Then
           ConsoleWrite("SUCCESS: Password processing completed" & @CRLF)
       Else
           ConsoleWrite("ERROR: Password processing failed after all attempts" & @CRLF)
       EndIf
       
       ; Ждем пока окно закроется или изменится
       Local $timeout = 0
       While WinExists($windowHandle) And $timeout < 50
           Sleep(100)
           $timeout += 1
       WEnd
       
       ConsoleWrite("Window processed, waiting for next..." & @CRLF)
       
   EndIf
   
   ; Пауза основного цикла
   Sleep(200)
WEnd