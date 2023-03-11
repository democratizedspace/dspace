# search for all .jpg files in the current directory. If the file name is a valid UUID, skip. If not, rename the file to a new UUID.

import os
import uuid

current_directory = os.getcwd()
print("current directory: ", current_directory)

for file in os.listdir(current_directory):
    filepath = os.path.join(current_directory, file)

    # if file is not .jpg, skip
    if not file.endswith(".jpg"):
        continue

    if os.path.isfile(filepath):
        # get filename without extension
        filename = os.path.splitext(file)[0]
        try:
            uuid.UUID(filename)
            print("valid uuid: ", filename)
            continue
        except ValueError:
            # generate a new uuid
            new_uuid = uuid.uuid4()
            # rename the file to the new uuid, file file extension .jpg
            os.rename(filepath, os.path.join(current_directory, f"{new_uuid}.jpg"))
            print("renamed file: ", file, " to: ", f"{new_uuid}.jpg")