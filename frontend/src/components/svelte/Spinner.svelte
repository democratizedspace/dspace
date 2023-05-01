<script>
    export let size = 30;
    export let color = "#1f2937";
</script>

<div class="spinner" style="width: {size}px; height: {size}px;">
    <div class="inner-spinner" style="border-color: {color}; border-left-color: transparent;"></div>
</div>

<style>
    .spinner {
        display: inline-block;
        position: relative;
        overflow: hidden;
    }

    .inner-spinner {
        box-sizing: border-box;
        position: absolute;
        width: 100%;
        height: 100%;
        border-width: 2px;
        border-style: solid;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        100% {
            transform: rotate(360deg);
        }
    }
</style>
