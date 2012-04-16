/* songeste.js */

function son_load_image(id)
{
	jQuery.getJSON('element/'+id+'/',function(data){
		jQuery('body').append('<image src="'+data.src+'" />');
	});
}

function son_init()
{
	jQuery.getJSON('elements/',function(data){
		var d = data;
		var c = d.length;
		for(var i=0; i < c; i++)
		{
			el = d[i];
			if(el.type == 'image')
				son_load_image(el.id);
		}
	});
}

jQuery(document).ready(son_init);