package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

// NewProxy takes target host and creates a reverse proxy.
// This is used to test running the app under a subpath of
// a custom domain (e.g. lightning.ai/echo).
func NewProxy(targetHost string) (*httputil.ReverseProxy, error) {
	url, err := url.Parse(targetHost)
	if err != nil {
		return nil, err
	}

	return httputil.NewSingleHostReverseProxy(url), nil
}

func main() {
	proxy, err := NewProxy("http://localhost:7501")
	if err != nil {
		panic(err)
	}

	handler := http.NewServeMux()

	handler.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/echo")
		proxy.ServeHTTP(w, r)
	})

	log.Fatal(http.ListenAndServe("localhost:8080", handler))

}
