<template>
  <div class="msg-container">
    <b>{{name}}:</b>
    <pre v-text="message"></pre>
  </div>
</template>
<script>
export default {
  name: 'message',
  props: {
    name: {
      type: String,
      require: true
    },
    message: {
      type: String,
      require: true
    }
  },
  data () {
    return {}
  }
}
</script>
<style>
.msg-container {
  border: 1px solid #dddee1;
  border-radius: 5px;
  background-color: #f8f8f9;
  padding: 5px;
  margin-bottom: 5px;
}
</style>


