import Route from '@ember/routing/route';

export default Route.extend({
    model: function() {
        fetch('https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/eon-llc')
           .then((res) => res.json())
           .then((data) => {
                let latest = data.items[0]
                if(latest) {
                    document.getElementById("blog").classList.remove("hide");
                    document.querySelector("#blog a").href = latest.link;
                    document.querySelector("#blog a span").textContent = latest.title;
                }
        })
    }
});
