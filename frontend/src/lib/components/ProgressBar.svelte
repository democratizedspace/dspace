<script>
    export let progress = 0;
</script>

<div class="progress-bar-container">
    <div class="progress-bar-fill" role="progressbar" style="width: {progress}%" />
</div>

<style>
    .progress-bar-container {
        width: 100%;
        background-color: #f3f3f3;
    }
    .progress-bar-fill {
        height: 20px;
        background-color: #68d46d;
    }
</style>
