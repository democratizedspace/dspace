<script>
    function chooseAvatar() {
      console.log("Choose avatar");
    }
</script>

<a class="avatar" href="/profile/avatar">
    <div class="text">Choose PFP</div>
</a>
  
  <style>
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-color: #68d46d;
      color: black;
      margin: 10px;
      border: 3px solid rgb(67, 255, 76);
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0.8;
      text-decoration: none;
    }

    .avatar:hover {
      cursor: pointer;
      opacity: 1;
    }
  
    .text {
      font-size: 16px;
      color: black;
    }
  </style>