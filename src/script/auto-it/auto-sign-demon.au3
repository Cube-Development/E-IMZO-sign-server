Opt("WinTitleMatchMode", 2) ; Частичное совпадение заголовка
; Получаем PIN из аргументов
Global $PIN = ""
If $CmdLine[0] >= 1 Then
   $PIN = $CmdLine[1]
Else
   MsgBox(0, "Ошибка", "PIN не передан!")
   Exit
EndIf
; Заголовок целевого окна
Global $TARGET_WINDOW = "Отмена через"

; Функция очистки старых окон
Func CleanupOldWindows()
   ConsoleWrite("Cleaning up old windows..." & @CRLF)
   Local $aList = WinList($TARGET_WINDOW)
   Local $cleaned = 0
   For $i = 1 To $aList[0][0]
       If Not BitAND(WinGetState($aList[$i][1]), 2) Then ; Невидимые окна
           WinKill($aList[$i][1])
           $cleaned += 1
       EndIf
   Next
   ConsoleWrite("Cleaned up " & $cleaned & " old windows" & @CRLF)
EndFunc

ConsoleWrite("AutoIt Password Demon started" & @CRLF)
ConsoleWrite("Target window: " & $TARGET_WINDOW & @CRLF)
ConsoleWrite("PIN length: " & StringLen($PIN) & " chars" & @CRLF)

; Очищаем старые окна при запуске
CleanupOldWindows()

ConsoleWrite("Waiting for window..." & @CRLF)

Global $lastCleanup = TimerInit()

While True
 ; Периодическая очистка каждые 5 минут
 If TimerDiff($lastCleanup) > 3600000 Then
     CleanupOldWindows()
     $lastCleanup = TimerInit()
 EndIf
 
 ; Проверяем существование целевого окна
 If WinExists($TARGET_WINDOW) Then
     Local $windowHandle = WinGetHandle($TARGET_WINDOW)
     Local $windowTitle = WinGetTitle($windowHandle)
     Local $windowState = WinGetState($windowHandle)
     
     ; Проверяем видимость окна
     If Not BitAND($windowState, 2) Then
         Sleep(1000)
         ContinueLoop
     EndIf
     
     ConsoleWrite("FOUND: " & $windowTitle & " (Handle: " & $windowHandle & ")" & @CRLF)
     
     ; Активируем окно
     WinActivate($windowHandle)
     If Not WinWaitActive($windowHandle, "", 3) Then
         ConsoleWrite("ERROR: Cannot activate window" & @CRLF)
         ContinueLoop
     EndIf
     
     ; Даем время для полной загрузки элементов управления
     Sleep(300)
     
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
             
             ; Фокусируемся на поле ввода
             ControlFocus($windowHandle, "", "[CLASS:Edit; INSTANCE:1]")
             Sleep(100)
             
             ; Очищаем поле (Ctrl+A заменится новым текстом)
             ControlSend($windowHandle, "", "[CLASS:Edit; INSTANCE:1]", "^a")
             Sleep(50)
             
             ; Вводим пароль посимвольно
             For $i = 1 To StringLen($PIN)
                 ControlSend($windowHandle, "", "[CLASS:Edit; INSTANCE:1]", StringMid($PIN, $i, 1))
                 Sleep(50)
             Next
             
             ; Проверяем что ввелось в поле
             Sleep(200)
             $inputText = ControlGetText($windowHandle, "", "[CLASS:Edit; INSTANCE:1]")
             
             ; Проверяем длину введенного текста
             If StringLen($inputText) = StringLen($PIN) Then
                 ConsoleWrite("SUCCESS: Input length matches PIN length (" & StringLen($inputText) & ") on attempt #" & $attempts & @CRLF)
                 ControlSend($windowHandle, "", "[CLASS:Edit; INSTANCE:1]", "{ENTER}")
                 $success = True
             Else
                 ConsoleWrite("RETRY: Input length mismatch on attempt #" & $attempts & ". Expected: " & StringLen($PIN) & ", Got: " & StringLen($inputText) & @CRLF)
                 ConsoleWrite("Input content: '" & $inputText & "'" & @CRLF)
                 Sleep(300)
             EndIf
         WEnd
         
         If Not $success Then
             ConsoleWrite("ERROR: Failed to input correct PIN length after " & $maxAttempts & " attempts" & @CRLF)
         EndIf
         
     Else
         ConsoleWrite("Edit control not found, trying direct window send..." & @CRLF)
         
         ; Очищаем
         ControlSend($windowHandle, "", "", "^a")
         Sleep(50)
         
         ; Вводим пароль посимвольно
         For $i = 1 To StringLen($PIN)
             ControlSend($windowHandle, "", "", StringMid($PIN, $i, 1))
             Sleep(50)
         Next
         
         ; Для варианта 2 не можем проверить длину, отправляем Enter
         Sleep(150)
         ControlSend($windowHandle, "", "", "{ENTER}")
         ConsoleWrite("WARNING: Cannot verify input length for direct window send" & @CRLF)
     EndIf
     
     If $success Then
         ConsoleWrite("SUCCESS: Password processing completed" & @CRLF)
     Else
         ConsoleWrite("ERROR: Password processing failed after all attempts" & @CRLF)
     EndIf
     
     ; Принудительно закрываем окно
     ConsoleWrite("Force closing window..." & @CRLF)
     WinClose($windowHandle)
     Sleep(500)
     If WinExists($windowHandle) Then
         WinKill($windowHandle)
         ConsoleWrite("Window force killed" & @CRLF)
     Else
         ConsoleWrite("Window closed normally" & @CRLF)
     EndIf
     
 EndIf
 
 ; Пауза основного цикла
 Sleep(1000)
WEnd