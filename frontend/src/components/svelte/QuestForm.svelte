<script>
    import { createEventDispatcher } from "svelte";

    let title = "";
    let description = "";
    let image = null;
    let previewUrl = null;

    const dispatch = createEventDispatcher();

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewUrl = e.target.result;
            };
            reader.readAsDataURL(file);
            image = file;
        } else {
            previewUrl = null;
            image = null;
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        if (image) {
            formData.append("image", image);
        }

        // Dispatch event to Astro or handle form submission
        dispatch("submit", formData);
    }
</script>

<form on:submit={handleSubmit} enctype="multipart/form-data" class="quest-form">
    <div class="form-group">
        <label for="title">Title*</label>
        <input type="text" id="title" bind:value={title} placeholder="Gather resources" required />
    </div>

    <div class="form-group">
        <label for="description">Description*</label>
        <textarea id="description" bind:value={description} placeholder="Describe the quest in detail. What needs to be done?" required></textarea>
    </div>

    <div class="form-group">
        <label for="image">Attach an Image</label>
        <input type="file" id="image" accept="image/*" on:change={handleImageUpload} />
        {#if previewUrl}
            <div class="image-preview-container">
                <img src={previewUrl} class="image-preview" alt="Preview" />
            </div>
        {/if}
    </div>

    <div class="form-submit">
        <button type="submit" class="submit-button">Create Quest</button>
    </div>
</form>

<style>
.quest-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #2c5837;
    border-radius: 12px;
    border: 2px solid #007006;
    color: #fff;
    font-family: Arial, sans-serif;
    text-align: center;
}

.form-group {
    margin-bottom: 15px;
    text-align: left;
}

label {
    display: block;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 6px;
    color: white;
}

input, textarea {
    width: 85%;
    padding: 10px;
    border-radius: 8px;
    background: #68d46d;
    color: black;
    font-size: 16px;
    border: 2px solid #007006;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, textarea:focus {
    border-color: #0f0;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
}

textarea {
    height: 120px;
    resize: vertical;
}

/* Style file upload */
input[type="file"] {
    width: 100%;
    background: #fff;
    border: 2px solid #007006;
    padding: 8px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
}

/* Image preview container */
.image-preview-container {
    text-align: center;
    margin-top: 10px;
}

/* Image preview */
.image-preview {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    border: 2px solid #007006;
    box-shadow: 0px 0px 10px rgba(0, 255, 0, 0.5);
    margin-top: 10px;
}

/* Submit Button */
.submit-button {
    font-size: 16px;
    padding: 10px 20px;
    background-color: #007006;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease-in-out;
}

.submit-button:hover {
    background-color: #005004;
}
</style>
