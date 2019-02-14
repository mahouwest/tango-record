
var inputt = document.querySelectorAll("input");

inputt.forEach((i) => {
	i.addEventListener("keydown", (e) => {
		if( e.key == "Enter" ){
			e.preventDefault();
		}
	})
})