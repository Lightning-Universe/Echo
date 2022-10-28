from prometheus_client import Counter

creating_echos = Counter('creating_echos_requests', 'Number of creating echos requests')

lb_requests = Counter('load_balancer_requests_total', 'Number of requests to the load balancer', ['name'])

works_counter = Counter('works_total', 'Number of works created or removed', ['name', 'method'])

running_works_requests = Counter('running_works_requests', 'Number of requests to get the number of running works')

works_echos_requests = Counter('works_echos_requests', 'Number of requests to the works to process echos', ['name', 'work_state'])
