# Thoughts

The Log keeps short written thoughts on this device. A thought is free text, shown as Markdown, with optional tags on its last line, and the log lists thoughts newest first.

| I want to | Do this |
|---|---|
| Write a thought | Type in the box at the top and press Shift + Enter; on a phone, press Save |
| Tag a thought | End the text with an empty line, then a last line such as `#books, #reading list` |
| Change a thought | Press the pencil on its card, change the text or tags and save; its time stays as it is |
| Delete a thought | Press the bin on its card, then Delete thought; Cancel keeps it |
| Get back text I did not save | Reopen the app in the same browser; the box shows the text again |
| Write again after scrolling the log | Press "Drag down to write a log", or scroll back to the top of the log |

What the system does:

- It saves every thought in this browser's storage only, and sends nothing over the network.
- It refuses blank text and a tag over 30 characters, and keeps the text in the box.
- It keeps the text in the box when a save fails, and says so.
- It shows times as "Today, 09:41", "Yesterday, 21:15" or "Sun 15 Nov, 22:10", in the browser's local time.

Storage items, limits and calls are in [reference](reference.md). Behaviour, diagrams, decisions, layout and motion are in [design](design.md).
